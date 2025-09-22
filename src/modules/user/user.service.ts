import { UserEntity } from "@db/entities";
import { UserRepository } from "@db/repositories";
import { Injectable, NotFoundException } from "@nestjs/common"; // Add this import

@Injectable() // Add this decorator
export class UserService {
	constructor(private readonly userRepo: UserRepository) {}
	async findById(id: string) {
		const user = await this.userRepo.findOne({ where: { id } });
		if (!user) {
			throw new NotFoundException(`User with ID ${id} not found`);
		}
		return user;
	}

	// Find by id OR username OR email
	async findByUniqueKey(uniqueKey: string) {
		const user = await this.userRepo.findOne({
			where: [{ id: uniqueKey }, { email: uniqueKey }, { username: uniqueKey }],
		});
		if (!user) {
			throw new NotFoundException(`User with key ${uniqueKey} not found`);
		}
		return user;
	}

	async getAll() {
		return this.userRepo.find();
	}

	async create(userData: Partial<UserEntity>) {
		const user = this.userRepo.create(userData);
		return this.userRepo.save(user);
	}

	async update(id: string, updateData: Partial<UserEntity>) {
		await this.userRepo.update(id, updateData);
		return this.findById(id);
	}

	async delete(id: string) {
		return this.userRepo.delete(id);
	}
}
