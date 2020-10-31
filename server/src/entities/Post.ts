import { Field, ObjectType } from "type-graphql";
import { PrimaryGeneratedColumn, Column, CreateDateColumn, Entity, UpdateDateColumn, BaseEntity } from "typeorm";

@ObjectType() //exposing this entity to graphql schema by @Field() and @ObjectType()
@Entity()
export class Post extends BaseEntity{

  @Field()
  @PrimaryGeneratedColumn()
  id!: number;
  
  @Field(() => String)
  @CreateDateColumn()
  createdAt = new Date();

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt = new Date();

  @Field()
  @Column()
  title!: string;

}